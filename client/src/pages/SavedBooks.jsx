import React from "react";
import { Container, Card, Button, Row, Col } from "react-bootstrap";

// Import Apollo Client hooks and custom utilities.
import { useQuery, useMutation } from "@apollo/client";
import { GET_ME } from "../utils/queries";
import { REMOVE_BOOK } from "../utils/mutations";
import Auth from "../utils/auth";
import { removeBookId } from "../utils/localStorage";

const SavedBooks = () => {
  // Use Apollo Client hooks to fetch user data and set up removeBook mutation.
  const { loading, data } = useQuery(GET_ME);
  const [removeBook] = useMutation(REMOVE_BOOK);

  // Extract user data from query result, or use empty object if data not yet loaded.
  const userData = data?.me || {};

  // Function to handle book deletion.
  const handleDeleteBook = async (bookId) => {
    // Check if user is logged in.
    if (!Auth.loggedIn()) {
      return false;
    }

    try {
      // Execute removeBook mutation.
      const { data } = await removeBook({
        variables: { bookId },
        // Update Apollo cache after successful mutation.
        update: (cache) => {
          const { me } = cache.readQuery({ query: GET_ME });
          cache.writeQuery({
            query: GET_ME,
            data: {
              me: {
                ...me,
                savedBooks: me.savedBooks.filter(
                  (book) => book.bookId !== bookId
                ),
              },
            },
          });
        },
      });

      // Check if the mutation was successful.
      if (data && data.removeBook) {
        // Upon success, remove book's id from localStorage.
        removeBookId(bookId);
      } else {
        throw new Error("Failed to remove book");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // if data isn't here yet, say so.
  if (loading) {
    return <h2>LOADING...</h2>;
  }

  return (
    <>
      {/* Header section */}
      <div className="text-light bg-dark p-5 container-fluid">
        <Container>
          <h1>Viewing saved books!</h1>
        </Container>
      </div>
      <Container>
        {/* Display number of saved books or message if no books saved */}
        <h2 className="pt-5">
          {userData.savedBooks?.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? "book" : "books"
              }:`
            : "You have no saved books!"}
        </h2>
        <Row>
          {/* Map over saved books and render a card for each */}
          {userData.savedBooks?.map((book) => {
            return (
              <Col md="4" key={book.bookId}>
                <Card border="dark">
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant="top"
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className="small">Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    <Button
                      className="btn-block btn-danger"
                      onClick={() => handleDeleteBook(book.bookId)}
                    >
                      Delete this Book!
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;